import * as THREE from 'three';
import {createFarmUI} from './farm-ui.js';
import {rewardSeeds} from './farming.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BUILD_DURATION, constructionAt, advanceConstruction } from './construction.js';
import { rotateSurface, installSurfaceDrag } from './navigation.js';
import {createNightSky} from './night-sky.js';
import {createSunnyClimate,CLIMATE_WEATHER} from './climate.js';
import {createWeatherEffects} from './weather-effects.js';
import {createStorybookSky} from '../storybook-sky.js';
import { createWorld, direction } from './world.js';
import { WEATHER, EVENTS, hash, random, dateKey, makeDay, weatherAt, lightAt, chooseEvent, eventDelay, restore, persist } from './ecology.js';

export function mountSunny(scopedDocument=globalThis.document,{preview=false}={}){
const document=scopedDocument;
const $ = id => document.getElementById(id), sceneHost = $('scene');
function fatal(message) { $('loading').hidden = true; const panel = document.createElement('div'); panel.className = 'fatal'; const text = document.createElement('p'); text.textContent = message; panel.append(text); const retry = document.createElement('button'); retry.textContent = '重新唤醒星球'; retry.onclick = () => location.reload(); panel.append(retry); $('app').append(panel); }
function boot() {
  const scenic=document.documentElement.dataset.experience==='scenic';
  if(scenic)document.querySelectorAll('.island-nav,#farm-panel,.pet-card,.build-card,.weather-card,#farm-focus,.intro,.footer').forEach(el=>{el.hidden=true;el.inert=true;});
  let storage; try { storage = localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw Error('unavailable'); } }; }
  let state = restore(storage, new Date()), day = makeDay(new Date()), previewWeather = null, previewHour = null, previousNaturalWeather = weatherAt(day, new Date()).type;
  const climate=createSunnyClimate({date:new Date(),seed:hash(state.day+'/seasons-v1')});
  let climateState=climate.getState();
  let focusedResident=null,surfaceDrag=null;
  let buildPreview=false,followBuild=false,buildUiSignature='',lastBuildSaved=0,lastBuildIndex=-1,focusRotation=null;
  let previewing=false,previewState=null,previewElapsed=0,gameStarted=!preview;
  let saved = gameStarted?persist(storage, state):false, disposed = false, running = !document.hidden, autoRotate = false, viewMode = 'meadow';
  let lastInteraction = -Infinity, interacting = false, lastUiAt = 0, lastFrame = 0, elapsed = 0, nextClickAt = 0, lastPresented = '', toastTimer, frameId;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38, 1, .1, 60), renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  scene.fog=new THREE.FogExp2('#d9e6ce',.024);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=true;renderer.shadowMap.needsUpdate=true;
  renderer.domElement.setAttribute('aria-label','三维星球：拖拽旋转，滚轮缩放，点击居民');renderer.domElement.setAttribute('tabindex','0');sceneHost.append(renderer.domElement);
  const homePosition=new THREE.Vector3(4.7,3.2,8.8).multiplyScalar(1.06);camera.position.copy(homePosition);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.06;controls.enablePan=false;controls.minDistance=5.3;controls.maxDistance=14;controls.rotateSpeed=.55;controls.zoomSpeed=.7;controls.target.set(0,.12,0);
  const world=createWorld(state.growth,state.construction.elapsed);scene.add(world.planet);world.planet.rotation.z=-.09;
  const hemi=new THREE.HemisphereLight('#cfdfeb','#697859',.96);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff0d2',1.72);sun.position.set(-3.5,6,7);sun.castShadow=true;const shadowSize=window.innerWidth<800?1024:2048;sun.shadow.mapSize.set(shadowSize,shadowSize);sun.shadow.camera.left=-4.2;sun.shadow.camera.right=4.2;sun.shadow.camera.top=4.2;sun.shadow.camera.bottom=-4.2;sun.shadow.camera.near=.5;sun.shadow.camera.far=23;sun.shadow.normalBias=.005;sun.shadow.bias=-.00012;sun.shadow.radius=3;scene.add(sun);
  const fill=new THREE.DirectionalLight('#a7ccc6',.30);fill.position.set(4,1,-5);scene.add(fill);
  // A soft floating shadow made locally, with no external image assets.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;const ctx=shadowCanvas.getContext('2d');const gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(71,86,53,.18)');gradient.addColorStop(.5,'rgba(71,86,53,.065)');gradient.addColorStop(1,'rgba(71,86,53,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const shadowTexture=new THREE.CanvasTexture(shadowCanvas),shadowMat=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,opacity:.7});const shadow=new THREE.Mesh(new THREE.PlaneGeometry(5,3),shadowMat);shadow.rotation.x=-Math.PI/2;shadow.position.y=-3.5;scene.add(shadow);
  const nightSky=createNightSky(hash(state.day+'/night-sky'));scene.add(nightSky.root);
  const env={rain:0,snow:0,cloud:.25,wind:.35,night:0,mist:0,light:1,sunset:0,petAway:0,spring:0,summer:0,autumn:1,winter:0,snowCover:0,wetness:0,storm:0,tornado:0,rainbow:0,meteorShower:0},targetEnv={...env};
  const weatherEffects=createWeatherEffects({scene,planet:world.planet,height:world.terrainHeight,radius:2.45});
  const fairySky=createStorybookSky({container:$('app'),variant:'night',seed:73417});fairySky.setActive(running);
  const sunDay=new THREE.Color('#fff0cf'),sunsetColor=new THREE.Color('#ffb895'),sunNight=new THREE.Color('#afd5fa'),bgNight=new THREE.Color('#233957'),hemiDay=new THREE.Color('#cfdfeb'),hemiDusk=new THREE.Color('#d4c4e6'),hemiNight=new THREE.Color('#7fa4cd'),groundDay=new THREE.Color('#697859'),groundDusk=new THREE.Color('#8b788f'),groundNight=new THREE.Color('#35556f'),fillDay=new THREE.Color('#a7ccc6'),fillDusk=new THREE.Color('#bcb0e1'),fillNight=new THREE.Color('#80bccc'),fogDay=new THREE.Color('#d5e6d8'),fogDusk=new THREE.Color('#e6c0cb'),skyEnv={...env,preview:false};
  let skyCssNight=-1,skyCssAtmosphere=-1;
  function updateSky(dt){Object.assign(skyEnv,env);skyEnv.preview=previewing;fairySky.update(dt,skyEnv);const night=previewing?0:env.night*(1-env.sunset*.92),atmosphere=previewing?0:Math.max(env.night,env.sunset);if(night!==skyCssNight){skyCssNight=night;$('app').style.setProperty('--storybook-night',String(night));}if(atmosphere!==skyCssAtmosphere){skyCssAtmosphere=atmosphere;$('app').style.setProperty('--storybook-atmosphere',String(atmosphere));}}
  let weatherType='clear',lighting=lightAt(12),weatherSlot=weatherAt(day,new Date()),uiSignature='';
  const travelPlaces=[['珊瑚湾','🐚'],['灯塔岛','🔆'],['云朵山','☁️'],['月光沙滩','🌙'],['风车港','🎐']];
  function travelIsAway(now=Date.now()){return state.travel.awayUntil>now;}
  let travelSignature='';
  function renderTravel(now=Date.now()){
    const t=state.travel,away=travelIsAway(now),left=Math.max(0,t.awayUntil-now), place=travelPlaces.find(p=>p[0]===t.destination);
    const signature=[t.name,t.clovers,t.snacks,t.charms,t.postcards.length,t.postcards[0]?.at,t.destination,away,Math.ceil(left/1000)].join('/');if(signature===travelSignature)return;travelSignature=signature;
    $('pet-name').textContent=t.name;$('clover-count').textContent=t.clovers;$('snack-count').textContent=t.snacks;$('charm-count').textContent=t.charms;$('postcard-count').textContent=t.postcards.length;
    $('pet-status').textContent=away?`正在前往 ${t.destination}`:'正在沙滩散步';$('pet-trip').textContent=away?`预计还有 ${Math.ceil(left/1000)} 秒回来 · ${place?.[1]||'🧳'}`:'准备好行囊，它会自己出发。';
    $('travel-button').textContent=away?'🫧 等待它回家':'🎒 准备行囊';$('travel-button').disabled=away;$('travel-button').classList.toggle('away',away);
    const list=$('postcard-list');list.replaceChildren();if(!t.postcards.length){const empty=document.createElement('p');empty.textContent='还没有明信片。准备好行囊，等它带故事回来。';list.append(empty);}for(const card of t.postcards.slice(0,8)){const item=document.createElement('article');const stamp=document.createElement('span'),body=document.createElement('div'),title=document.createElement('strong'),date=document.createElement('small'),text=document.createElement('p');stamp.className='postcard-stamp';stamp.textContent=card.icon||'💌';title.textContent=card.place;date.textContent=new Date(card.at).toLocaleDateString('zh-CN',{month:'numeric',day:'numeric'});text.textContent=card.text;body.append(title,date,text);item.append(stamp,body);list.append(item);}
  }
  function finishTrip(now=Date.now()){
    const t=state.travel;if(!t.awayUntil||t.awayUntil>now)return;const place=travelPlaces.find(p=>p[0]===t.destination)||travelPlaces[0], souvenirs=['彩色贝壳','海盐小瓶','云朵果实','灯塔贴纸','风车明信片'],texts=['海风把它的耳朵吹得软乎乎的。','它在浪花里捡到了一点亮晶晶的东西。','它说那里的云朵，摸起来像棉花糖。','灯塔的光转了一圈，刚好照到它的帽子。','港口的风车送了它一阵回家的风。'];t.postcards.unshift({place:place[0],icon:place[1],at:now,text:texts[t.trips%texts.length]});t.postcards=t.postcards.slice(0,30);t.souvenirs.unshift(souvenirs[t.trips%souvenirs.length]);t.souvenirs=t.souvenirs.slice(0,30);rewardSeeds(state.farm,t.awayUntil);t.trips++;t.clovers+=2;t.awayUntil=0;t.destination='';t.startedAt=0;state.history.unshift({id:'birds',at:now});state.history=state.history.slice(0,24);present('birds',now);world.trigger('birds',state.growth);renderTravel(now);diary();save();toast(`${t.name}回来了，带回了${place[0]}的明信片，还有 2 粒草莓种子。`);
  }
  function startTrip(){const t=state.travel;if(travelIsAway()||t.snacks<1){toast(t.snacks<1?'今天没有便当了，先收集一点食物吧。':'它已经在路上了。');return;}const rng=random(hash(`${state.day}/trip/${t.trips}/${t.counter}`)),place=travelPlaces[Math.floor(rng()*travelPlaces.length)];t.snacks--;t.clovers=Math.max(0,t.clovers-1);t.destination=place[0];t.startedAt=Date.now();t.awayUntil=Date.now()+Math.round(65000+rng()*35000);state.history.unshift({id:'breeze',at:Date.now()});state.history=state.history.slice(0,24);renderTravel();save();world.trigger('petals',state.growth);present('breeze',Date.now());toast(`${t.name}背好行囊，去${place[0]}旅行啦。`);}
  $('plant-count').textContent=String(world.stats.trees+world.stats.flowers+world.stats.shrubs+state.growth);$('resident-count').textContent=String(world.residents.length);
  function restReason(){return targetEnv.tornado>.3?'风大了，伙伴们回屋歇一歇':targetEnv.rain>.35?'下雨了，伙伴们先歇一歇':weatherType==='snow'?'雪天休息，放晴再继续':lighting.daylight<.18?'夜深了，伙伴们明早继续':'';}
  function focusBuilding(){
    followBuild=true;if(viewMode!=='meadow')setView('meadow');
    const n=world.construction.getFocus();focusRotation=new THREE.Quaternion().setFromUnitVectors(n,new THREE.Vector3(0,1,0));buildUiSignature='';
  }
  function renderBuild(){
    const b=constructionAt(buildPreview?BUILD_DURATION:state.construction.elapsed),reason=restReason();
    const signature=[Math.floor(b.elapsed),state.construction.paused,state.construction.speed,buildPreview,followBuild,reason].join('/');if(signature===buildUiSignature)return;buildUiSignature=signature;
    $('build-title').textContent=buildPreview?'成品小岛 · 自由看看':b.complete?'我们的小岛建好啦':b.project.name;
    $('build-count').textContent=`${Math.min(8,b.index+1)} / 8`;
    $('build-phase').textContent=buildPreview?'这是成品预览，返回后继续原来的进度':b.complete?'小伙伴开始在岛上过自己的小日子':state.construction.paused?'已暂停，随时可以继续':reason||b.phase;
    const percent=Math.floor(b.total*100);$('build-fill').style.width=`${b.total*100}%`;$('build-progress').setAttribute('aria-valuenow',String(percent));$('build-percent').textContent=`${percent}%`;
    $('build-remaining').textContent=b.complete?'完工啦':`约 ${Math.max(1,Math.ceil((BUILD_DURATION-b.elapsed)/state.construction.speed/60))} 分钟`;
    const workers=world.residents.filter(p=>p.working),idle=world.residents.filter(p=>!p.working);
    $('build-crew').textContent=(workers.length?`${workers.map(p=>p.name).join('、')}在帮忙；`:'')+(idle.length?`${idle[0].name}${idle[0].activity}，其他伙伴自由活动。`:'');
    $('build-pause').textContent=state.construction.paused?'▶ 继续':'Ⅱ 暂停';$('build-pause').disabled=buildPreview||b.complete;$('build-pause').setAttribute('aria-pressed',String(state.construction.paused));
    $('build-speed').textContent=state.construction.speed===3?'1× 慢慢来':'3× 加速';$('build-speed').setAttribute('aria-pressed',String(state.construction.speed===3));
    $('build-focus').setAttribute('aria-pressed',String(followBuild));$('build-preview').textContent=buildPreview?'返回建造过程':'看完整小岛';
  }
  $('build-pause').onclick=()=>{state.construction.paused=!state.construction.paused;renderBuild();save();};
  $('build-speed').onclick=()=>{state.construction.speed=state.construction.speed===3?1:3;renderBuild();save();};
  $('build-focus').onclick=()=>{focusBuilding();renderBuild();};
  $('build-preview').onclick=()=>{buildPreview=!buildPreview;focusRotation=null;world.construction.setProgress(buildPreview?BUILD_DURATION:state.construction.elapsed);renderBuild();};
  $('build-replay').onclick=()=>{state.construction.elapsed=0;state.construction.paused=false;buildPreview=false;lastBuildIndex=-1;world.construction.setProgress(0);focusBuilding();renderBuild();save();toast('从一片绿草地开始，再看小伙伴建一次家。');};
  function save(){if(previewing||!gameStarted)return;saved=persist(storage,state);if($('farm-save')){$('farm-save').textContent=saved?'进度已保存在当前浏览器':'暂时无法保存，关闭页面会丢失进度';$('farm-save').style.color=saved?'':'#b66b54';}$('storage-note').textContent=saved?'记录保存在当前浏览器中，新的一天另起一页。':'此浏览器未允许本地保存；记录仅保留至本次页面关闭。';}
  function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4200);}
  function present(id,stamp){const e=EVENTS[id];$('event-icon').textContent=e.icon;$('event-title').textContent=e.title;$('event-text').textContent=e.text;const el=document.querySelector('.event-body');el.classList.remove('enter');void el.offsetWidth;el.classList.add('enter');lastPresented=id;if(stamp)$('event-title').title=`${new Date(stamp).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})} 发生`;}
  function diary(){const list=$('diary-list');list.replaceChildren();if(!state.history.length){const li=document.createElement('li');li.textContent='手记还是空白的，第一场相遇就快来了。';list.append(li);}for(const item of state.history){const e=EVENTS[item.id],li=document.createElement('li'),time=document.createElement('time'),body=document.createElement('div'),title=document.createElement('strong'),p=document.createElement('p');time.dateTime=new Date(item.at).toISOString();time.textContent=new Date(item.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});title.textContent=`${e.icon} ${e.title}${item.preview?' · 预览':''}`;p.textContent=e.text;body.append(title,p);li.append(time,body);list.append(li);} }
  function encounter(forced){const now=Date.now(),rng=random(hash(`${state.day}/encounter/${state.counter}`));let id=forced||chooseEvent(weatherType,lighting.daylight<.18,state.lastId,rng);if(id==='sprouts'&&state.growth>=12)id='harvest';state.counter++;state.lastId=id;state.nextAt=now+eventDelay(rng);if(id==='sprouts')state.growth=Math.min(12,state.growth+1);if(id==='harvest')state.growth=3;state.history.unshift({id,at:now,preview:climateState.mode==='journey'||climateState.seasonMode!=='auto'||climateState.weatherMode!=='auto'||previewWeather!==null||previewHour!==null});state.history=state.history.slice(0,24);world.trigger(EVENTS[id].effect,state.growth);present(id,now);diary();save();$('plant-count').textContent=String(world.stats.trees+world.stats.flowers+world.stats.shrubs+state.growth); }
  function syncClimate(dt,now=new Date()){
    const natural=weatherAt(day,now),localHour=now.getHours()+now.getMinutes()/60+now.getSeconds()/3600;
    climate.update(dt,now,{weatherType:natural.type,hour:localHour});climateState=climate.getState();weatherType=climateState.weather;lighting=lightAt(climateState.hour);
    Object.assign(targetEnv,climateState.env,{night:1-lighting.daylight,sunset:lighting.sunset});
  }
  const seasonStories={spring:'春风让花朵醒来，粉色花瓣慢慢经过小路。',summer:'草木长成浓浓的绿，阳光在海湾里闪闪发亮。',autumn:'秋风把树叶染成蜜糖色，落叶沿着小路旅行。',winter:'树梢、屋顶和草地盖上薄雪，窗灯把冬天暖起来。'};
  const weatherStories={clear:'阳光落在草尖上，伙伴们又出来散步了。',cloudy:'云影慢慢经过，小岛换上一层柔和的光。',rain:'小伙伴撑起伞，雨滴在海面画出小圆圈。',mist:'远处披上薄纱，熟悉的风景也有了秘密。',snow:'雪花轻轻落下，积雪慢慢留在树梢和地面。',storm:'雨幕变密、海浪起伏，伙伴们往温暖的小屋赶去。',tornado:'旋风卷起落叶，树梢和海浪一起回应这阵风。',rainbow:'雨停了，海湾升起一道七色的小桥。',meteor:'灯光亮起，一场流星雨悄悄经过头顶。'};
  function renderClimate(){
    const c=climateState;
    $('climate-now').textContent=`${c.seasonLabel} · ${c.weatherLabel}`;
    $('climate-icon').textContent={spring:'✿',summer:'☀',autumn:'❧',winter:'❄'}[c.season];
    $('climate-mode-label').textContent=c.mode==='today'?'随今日 · 打开气象手账':'四季漫游 · 换一幅风景';
    $('climate-guide').textContent=c.mode==='today'?'季节跟随本地日期，昼夜跟随时间；天气是小岛自己的模拟。':c.seasonMode==='auto'?'每 75 秒翻过一个季节，天气会带来小小的惊喜。':'季节停在这一页。选择自动轮转，就能继续四季之旅。';
    $('climate-story').textContent=(c.weather==='clear'?seasonStories[c.season]:weatherStories[c.weather])||seasonStories[c.season];
    $('season-auto').setAttribute('aria-pressed',String(c.seasonMode==='auto'));$('weather-auto').setAttribute('aria-pressed',String(c.weatherMode==='auto'));
    document.querySelectorAll('[data-season]').forEach(b=>b.setAttribute('aria-pressed',String(c.seasonMode!=='auto'&&b.dataset.season===c.season)));
    document.querySelectorAll('[data-climate-mode]').forEach(b=>b.setAttribute('aria-pressed',String(c.mode===b.dataset.climateMode)));
    document.querySelectorAll('[data-climate-weather]').forEach(b=>b.setAttribute('aria-pressed',String(c.weatherMode!=='auto'&&(b.dataset.climateWeather===(c.weather==='clear'&&Math.abs(c.hour-17.5)<.1?'sunset':c.weather)))));
    document.documentElement.dataset.season=c.season;document.documentElement.dataset.weather=c.weather;
  }
  function climatePanel(open){$('climate-panel').hidden=!open;$('climate-toggle').setAttribute('aria-expanded',String(open));}
  $('climate-toggle').onclick=()=>climatePanel($('climate-panel').hidden);$('climate-close').onclick=()=>climatePanel(false);
  document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>{climate.selectSeason(b.dataset.season);updateUi(new Date(),true);toast(seasonStories[b.dataset.season]);});
  document.querySelectorAll('[data-climate-mode]').forEach(b=>b.onclick=()=>{climate.selectSeason('auto');climate.selectWeather('auto');climate.selectHour(null);climate.setMode(b.dataset.climateMode);previewWeather=previewHour=null;updateUi(new Date(),true);});
  $('season-auto').onclick=()=>{climate.selectSeason('auto');updateUi(new Date(),true);};
  $('weather-auto').onclick=()=>{climate.selectWeather('auto');climate.selectHour(null);previewWeather=previewHour=null;updateUi(new Date(),true);};
  function selectClimateWeather(value){const sunset=value==='sunset';climate.selectWeather(sunset?'clear':value);climate.selectHour(sunset?17.5:value==='meteor'?22:value==='rainbow'?12.5:value==='tornado'?16:null);previewWeather=sunset?'clear':value;previewHour=sunset?17.5:value==='meteor'?22:value==='rainbow'?12.5:value==='tornado'?16:null;updateUi(new Date(),true);toast(sunset?'天边变暖，影子变长。一起等一场日落。':weatherStories[value]);}
  document.querySelectorAll('[data-climate-weather]').forEach(b=>b.onclick=()=>selectClimateWeather(b.dataset.climateWeather));
  function updateUi(now,force=false){
    if(previewing||!gameStarted)return;
    finishTrip(now.getTime());renderTravel(now.getTime());
    if(dateKey(now)!==state.day){state={...state,day:dateKey(now),history:[],lastId:'',counter:0,visits:state.visits+1,nextAt:now.getTime()+18000};day=makeDay(now);previousNaturalWeather=weatherAt(day,now).type;diary();save();toast('新的一天到了，天气和手记都翻开了新的一页。');}
    weatherSlot=weatherAt(day,now);const oldType=weatherType;syncClimate(0,now);const hour=climateState.hour,w={...WEATHER.clear,...CLIMATE_WEATHER[weatherType],...WEATHER[weatherType],label:climateState.weatherLabel};
    targetEnv.petAway=travelIsAway(now.getTime())?1:0;renderBuild();
    if(climateState.mode==='today'&&climateState.weatherMode==='auto'&&previousNaturalWeather==='rain'&&weatherSlot.type==='clear'){encounter('rainbow');}previousNaturalWeather=weatherSlot.type;
    const signature=`${state.day}/${Math.floor(now.getTime()/60000)}/${weatherType}/${previewHour}/${previewWeather}/${state.visits}/${climateState.season}/${climateState.mode}/${Math.floor(hour*6)}/${Math.ceil(climateState.phaseRemaining)}`;
    if(signature===uiSignature&&!force)return;uiSignature=signature;
    $('date-label').textContent=now.toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'short'});$('clock-label').textContent=climateState.mode==='journey'?`小岛 ${String(Math.floor(hour)).padStart(2,'0')}:${String(Math.floor((hour%1)*60)).padStart(2,'0')}`:now.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});$('visit-label').textContent=`和星球相遇的第 ${state.visits} 天`;
    $('weather-name').textContent=w.label;$('weather-icon').textContent=w.icon;$('weather-note').textContent=w.note;$('weather-temp').replaceChildren(document.createTextNode(String(previewWeather?w.temperature:weatherSlot.temperature)));const degree=document.createElement('small');degree.textContent='°';$('weather-temp').append(degree);$('phase-label').textContent=lighting.label;
    const preview=climateState.mode!=='today'||climateState.weatherMode!=='auto'||climateState.seasonMode!=='auto'||previewHour!==null;$('weather-mode').textContent=preview?'预览中':'今日天气';$('weather-mode').style.color=preview?'#bb8b52':'';
    const next=day.slots.find(s=>s.minute>now.getHours()*60+now.getMinutes());const hhmm=minute=>`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
    $('next-weather').textContent=preview?'自由看一看':next?`${hhmm(next.minute)} · ${WEATHER[next.type].label}`:'明天又是新一天';
    $('forecast').replaceChildren();for(const slot of day.slots){const item=document.createElement('div');item.className='forecast-item'+(slot===weatherSlot?' active':'');const time=document.createElement('small'),icon=document.createElement('span'),name=document.createElement('small');time.textContent=hhmm(slot.minute);icon.textContent=WEATHER[slot.type].icon;name.textContent=WEATHER[slot.type].label;item.append(time,icon,name);$('forecast').append(item);}
    document.documentElement.dataset.phase=lighting.daylight<.08?'night':lighting.sunset>.45?'dusk':'morning';
    document.querySelectorAll('[data-time]').forEach(b=>b.setAttribute('aria-pressed',String(previewHour!==null&&Math.abs(Number(b.dataset.time)-previewHour)<.05)));$('natural-time').setAttribute('aria-pressed',String(!preview));
    renderClimate();const shownHour=hour;$('time-range').value=String(shownHour);$('time-value').textContent=hhmm(Math.floor(shownHour*60));document.querySelectorAll('[data-weather]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.weather===previewWeather)));
    $('eco-note').textContent=travelIsAway(now.getTime())?`${state.travel.name}正在${state.travel.destination}旅行，岛上替它保管好阳光`:weatherType==='rain'?'小居民撑伞回家，海浪接住雨滴':weatherType==='snow'?'屋子暖暖的，小雪落在树梢上':lighting.daylight<.18?'海边窗灯亮起，晚风吹过归家的小路':'阳光、海风和小日子，都刚刚好';
    const bg=new THREE.Color(w.color).lerp(new THREE.Color('#ffe8d6'),lighting.sunset*.85).lerp(bgNight,(1-lighting.daylight)*(1-lighting.sunset*.9));document.body.style.backgroundColor=`#${bg.getHexString()}`;document.body.style.transition='background-color 2s';
    const dark=lighting.daylight<.2;document.documentElement.style.setProperty('--daylight',String(lighting.daylight));document.documentElement.style.setProperty('--ink',dark?'#f2f1de':'#385d4b');document.documentElement.style.setProperty('--muted',dark?'#c5d5e3':'#6a8673');document.documentElement.style.setProperty('--line',dark?'#d2e6ed40':'#82b7bd35');document.documentElement.style.setProperty('--panel',dark?'#243953eb':'#fffff4df');
    if(oldType!==weatherType&&weatherType==='rainbow')$('climate-story').textContent='雨停了，海湾升起一道七色的小桥。';
  }
  function resize(){const rect=sceneHost.getBoundingClientRect();if(!rect.width||!rect.height)return;camera.aspect=rect.width/rect.height;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(viewMode==='meadow'?38:38)/2)/Math.min(1,Math.max(.42,camera.aspect))));camera.updateProjectionMatrix();renderer.setSize(rect.width,rect.height,false);}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(sceneHost);resize();
  function setRotation(){const b=$('rotate-toggle');b.setAttribute('aria-pressed',String(autoRotate));b.title=autoRotate?'暂停自动旋转':'开启自动旋转';b.innerHTML=`<span>${autoRotate?'↻':'Ⅱ'}</span>${autoRotate?'慢慢转':'已暂停'}`;}
  $('rotate-toggle').onclick=()=>{if(viewMode==='meadow'){setView('globe');autoRotate=true;}else autoRotate=!autoRotate;setRotation();};setRotation();
  $('encounter').onclick=()=>{if(Date.now()<nextClickAt)return;updateUi(new Date());encounter();nextClickAt=Date.now()+5000;$('encounter').disabled=true;setTimeout(()=>{$('encounter').disabled=false;},5000);};
  $('travel-button').onclick=startTrip;$('postcard-toggle').onclick=()=>{const p=$('postcard-panel');p.hidden=!p.hidden;};
  function setView(mode){
    surfaceDrag?.reset();const keepOrientation=world.planet.quaternion.clone();
    controls.enableDamping=false;controls.update();controls.enableDamping=true;
    focusedResident=null;$('animal-view').setAttribute('aria-pressed','false');focusRotation=null;viewMode=mode;const close=mode==='meadow';controls.enableRotate=false;document.documentElement.dataset.view=mode;
    world.planet.userData.closeView=true;world.planet.rotation.set(0,0,0);
    if(close){
      world.planet.quaternion.setFromUnitVectors(direction(.38,.06),new THREE.Vector3(0,1,0));
      controls.target.set(0,2.67,0);camera.position.set(.45,5.95,2.15);
      controls.minDistance=2.1;controls.maxDistance=8.5;controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI;
      autoRotate=false;setRotation();
    }else{
      world.planet.quaternion.copy(keepOrientation);controls.target.set(0,0,0);camera.position.set(.45,3.28,2.15).normalize().multiplyScalar(11.3);
      controls.minDistance=5.3;controls.maxDistance=14;controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI;
    }
    $('meadow-view').setAttribute('aria-pressed',String(close));$('globe-view').setAttribute('aria-pressed',String(!close));
    $('coast-view').setAttribute('aria-pressed','false');$('fishing-view').setAttribute('aria-pressed','false');
    controls.update();resize();lastInteraction=performance.now();
  }
  $('meadow-view').onclick=()=>{setView('meadow');toast('草原漫游 · 向任意方向拖动，探索星球每一面。');};
  $('coast-view').onclick=()=>{setView('meadow');followBuild=false;buildUiSignature='';world.planet.quaternion.setFromUnitVectors(direction(-.18,.69),new THREE.Vector3(0,1,0));controls.target.set(0,2.43,0);camera.position.set(.7,5.5,1.6);controls.update();$('coast-view').setAttribute('aria-pressed','true');$('meadow-view').setAttribute('aria-pressed','false');toast('珊瑚海湾 · 看看水下的小花园，等等乘风而来的帆船。');};
  $('fishing-view').onclick=()=>{
    setView('meadow');followBuild=false;buildUiSignature='';
    const n=world.fishing.normal;world.planet.quaternion.setFromUnitVectors(n,new THREE.Vector3(0,1,0));world.planet.updateMatrixWorld(true);
    const q=world.planet.quaternion.clone().multiply(world.fishing.frame.quaternion),front=new THREE.Vector3(0,0,1).applyQuaternion(q),side=new THREE.Vector3(1,0,0).applyQuaternion(q);
    controls.target.set(0,world.terrainHeight(n)+.12,0).addScaledVector(front,.20);
    camera.position.copy(controls.target).addScaledVector(front,1.15).addScaledVector(side,1.42).add(new THREE.Vector3(0,1.30,0));controls.minDistance=1.1;controls.update();
    $('fishing-view').setAttribute('aria-pressed','true');$('meadow-view').setAttribute('aria-pressed','false');
    toast(env.night>.58?'月亮出来了，阿栗收好鱼竿回家啦。':'风轻轻，浮漂晃一晃。阿栗在这里等鱼儿咬钩。');
  };
  let animalIndex=0;
  $('animal-view').onclick=()=>{
    const outdoors=world.residents.filter(p=>p.root.visible);
    if(!outdoors.length){$('cottage-view').click();toast('小伙伴都回家睡觉了。窗灯亮着，明早再来找它们玩吧。');return;}
    const p=outdoors[animalIndex++%outdoors.length];setView('meadow');followBuild=false;focusedResident=p;
    world.planet.quaternion.setFromUnitVectors(p.normal,new THREE.Vector3(0,1,0));world.planet.updateMatrixWorld(true);
    const center=p.root.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,.25,0)),q=world.planet.quaternion.clone().multiply(p.root.quaternion).multiply(p.body.quaternion),front=new THREE.Vector3(0,0,1).applyQuaternion(q),right=new THREE.Vector3(1,0,0).applyQuaternion(q);
    controls.minDistance=.75;controls.maxDistance=5.5;controls.target.copy(center);camera.position.copy(center).addScaledVector(front,1.08).addScaledVector(right,.40).add(new THREE.Vector3(0,.40,0));controls.update();
    $('animal-view').setAttribute('aria-pressed','true');$('meadow-view').setAttribute('aria-pressed','false');toast(p.species+' '+p.name+' · 再点一次，看看下一位伙伴。拖动可退出跟随。');
  };
  let cottageIndex=0;
  $('cottage-view').onclick=()=>{
    const available=world.cottages.filter(c=>c.getState().complete),choices=available.length?available:world.cottages.slice(0,1),c=choices[cottageIndex++%choices.length];
    setView('meadow');followBuild=false;buildUiSignature='';
    world.planet.quaternion.setFromUnitVectors(c.root.position.clone().normalize(),new THREE.Vector3(0,1,0));world.planet.updateMatrixWorld(true);
    const center=c.root.position.clone().applyQuaternion(world.planet.quaternion),q=world.planet.quaternion.clone().multiply(c.root.quaternion).multiply(c.house.quaternion);
    const front=new THREE.Vector3(0,0,1).applyQuaternion(q),right=new THREE.Vector3(1,0,0).applyQuaternion(q);
    controls.target.copy(center).add(new THREE.Vector3(0,.28,0));camera.position.copy(controls.target).addScaledVector(front,1.65).addScaledVector(right,.85).add(new THREE.Vector3(0,1.5,0));controls.update();
    toast(c.getState().complete?`${c.name} · 点击小屋，敲敲门；再次点“逛逛小屋”拜访下一家。`:`${c.name}还在搭建，也可以点“看完整小岛”预览完工效果。`);
  };
  $('globe-view').onclick=()=>setView('globe');
  $('home-view').onclick=()=>{setView(viewMode);toast('回到这条熟悉的小路。');};
  $('preview-toggle').onclick=()=>{const panel=$('preview-panel');panel.hidden=!panel.hidden;$('preview-toggle').setAttribute('aria-expanded',String(!panel.hidden));};
  document.querySelectorAll('[data-weather]').forEach(b=>b.onclick=()=>selectClimateWeather(b.dataset.weather));
  $('time-range').oninput=e=>{if(['meteor','rainbow','tornado'].includes(weatherType)){climate.selectWeather('clear');previewWeather='clear';}previewHour=Number(e.target.value);climate.selectHour(previewHour);updateUi(new Date(),true);};
  function returnToToday(){climate.selectSeason('auto');climate.selectWeather('auto');climate.selectHour(null);climate.setMode('today');previewWeather=null;previewHour=null;updateUi(new Date(),true);toast('已回到今天的天气与本地时间。');}
  $('return-live').onclick=returnToToday;$('natural-time').onclick=returnToToday;
  document.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>{if(['meteor','rainbow','tornado'].includes(weatherType)){previewWeather='clear';climate.selectWeather('clear');}previewHour=Number(b.dataset.time);climate.selectHour(previewHour);updateUi(new Date(),true);toast(`${b.textContent.trim()} · 天色和岛上的灯光正在慢慢变化。`);});
  $('sunny-view').onclick=()=>{setView('meadow');previewWeather='clear';previewHour=8.5;climate.selectWeather('clear');climate.selectHour(8.5);updateUi(new Date(),true);toast('晴日草原 · 阳光落在草尖上。');};
  function toggleDiary(open){$('diary').hidden=!open;$('diary-toggle').setAttribute('aria-expanded',String(open));if(open)diary();}
  $('diary-toggle').onclick=()=>toggleDiary($('diary').hidden);$('diary-close').onclick=()=>toggleDiary(false);$('help-button').onclick=()=>$('help-dialog').showModal();document.querySelector('.brand').onclick=e=>{e.preventDefault();$('home-view').click();};
  $('quality-toggle').onclick=()=>{const low=renderer.shadowMap.enabled;renderer.shadowMap.enabled=!low;renderer.shadowMap.needsUpdate=true;world.meadow.setLowQuality(low);renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,1.25));const materials=new Set();scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)materials.add(m);if(o.customDepthMaterial)materials.add(o.customDepthMaterial);if(o.customDistanceMaterial)materials.add(o.customDistanceMaterial);});materials.forEach(m=>{m.needsUpdate=true;});$('quality-toggle').textContent=`流畅模式：${low?'开启':'关闭'}`;$('quality-toggle').setAttribute('aria-pressed',String(low));resize();};
  controls.addEventListener('start',()=>{focusedResident=null;$('animal-view').setAttribute('aria-pressed','false');followBuild=false;focusRotation=null;buildUiSignature='';interacting=true;lastInteraction=performance.now();});controls.addEventListener('end',()=>{interacting=false;lastInteraction=performance.now();});
  const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();let down=null;
  renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});renderer.domElement.addEventListener('pointercancel',()=>{down=null;});
  renderer.domElement.addEventListener('pointerup',e=>{
    if(previewing){down=null;return;}
    if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6){down=null;return;}down=null;
    const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);world.planet.updateMatrixWorld(true);
    const hit=raycaster.intersectObjects([world.land,world.ocean,...world.farm.picks,...world.residents.map(p=>p.root),...world.cottages.map(c=>c.root)],true).find(h=>{for(let p=h.object;p;p=p.parent)if(!p.visible)return false;return true;});
    if(!hit||hit.object===world.land||hit.object===world.ocean)return;
    for(let o=hit.object;o;o=o.parent){if(Number.isInteger(o.userData.plotId)){if(!scenic)farmUI.select(o.userData.plotId);return;}if(o.userData.farmPlace){if(!scenic)farmUI.activate(o.userData.farmPlace);return;}}
    let obj=hit.object;while(obj&&obj.parent!==world.planet)obj=obj.parent;
    const cottage=world.cottages.find(c=>c.root===obj);if(cottage){toast(cottage.visit().message);return;}
    const resident=world.residents.find(p=>p.root===obj);if(resident)toast(`${resident.species}${resident.name}（${resident.job}）· ${resident.activity}：${weatherType==='rain'?'一起躲躲雨吧，回家的路很近。':lighting.daylight<.2?'星星出来啦，明天再一起散步。':['今天也有好好长大呀。','听说花田里来了新朋友。','不赶时间，一起走一会儿吧。'][resident.i%3]}`);
  });
  const stopSurfaceDrag=surfaceDrag=installSurfaceDrag(renderer.domElement,camera,world.planet,()=>!previewing,active=>{interacting=active;lastInteraction=performance.now();if(active){focusedResident=null;$('animal-view').setAttribute('aria-pressed','false');followBuild=false;focusRotation=null;buildUiSignature='';}},()=>{down=null;});
  renderer.domElement.addEventListener('keydown',e=>{
    if(previewing)return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','Home',' '].includes(e.key))e.preventDefault();
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key)){followBuild=false;focusRotation=null;buildUiSignature='';}
    const offset=camera.position.clone().sub(controls.target),orbit=new THREE.Spherical().setFromVector3(offset);
    surfaceDrag.reset();const turn={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]}[e.key];if(turn)rotateSurface(world.planet,camera,...turn,600);
    if(e.key==='+'||e.key==='=')orbit.radius*=.92;if(e.key==='-')orbit.radius*=1.08;
    orbit.phi=THREE.MathUtils.clamp(orbit.phi,Math.max(.01,controls.minPolarAngle),Math.min(Math.PI-.01,controls.maxPolarAngle));
    orbit.radius=THREE.MathUtils.clamp(orbit.radius,controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(orbit));controls.update();
    if(e.key==='Home')$('home-view').click();if(e.key===' ')$('rotate-toggle').click();lastInteraction=performance.now();
  });
  const onDocumentKeydown=e=>{if(running&&e.key==='Escape'){toggleDiary(false);climatePanel(false);}};
  const onVisibilityChange=()=>{running=!document.hidden;fairySky.setActive(running&&!previewing);lastFrame=0;if(running&&!previewing&&gameStarted){updateUi(new Date(),true);if(state.nextAt<Date.now()){state.nextAt=Date.now()+eventDelay(random(hash(`${state.day}/${state.counter}/resume`)));save();}}};
  document.addEventListener('keydown',onDocumentKeydown);
  document.addEventListener('visibilitychange',onVisibilityChange);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();running=false;fairySky.setActive(false);toast('画面暂时休息了，正在等待图形环境恢复。');renderer.domElement.classList.add('context-lost');});renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
  // Farm UI normally settles offline growth at startup. A selector preview is
  // read-only, so retain the restored state until the user actually enters.
  const initialFarm=!gameStarted?JSON.parse(JSON.stringify(state.farm)):null;
  const farmUI=createFarmUI({document,scenic,getState:()=>state,world,save,toast,renderTravel,focus(place){setView('meadow');followBuild=false;buildUiSignature='';if(place==='orchard'){world.planet.quaternion.setFromUnitVectors(direction(.92,.46),new THREE.Vector3(0,1,0));controls.update();}}});
  if(initialFarm){state.farm=initialFarm;world.farm.sync(state.farm);}
  setView('meadow');updateUi(new Date(),true);Object.assign(env,targetEnv);diary();save();
  if(state.history.length){present(state.history[0].id,state.history[0].at);$('event-title').textContent+=' · 今日手记';}
  function setPreview(value){
    value=!!value;if(disposed||value===previewing)return;
    if(value){
      previewState={climate:climate.captureState(),viewMode,autoRotate,followBuild,focusedResident,focusRotation:focusRotation?.clone()||null,previewWeather,previewHour,weatherType,lighting:{...lighting},env:{...env},targetEnv:{...targetEnv},position:camera.position.clone(),up:camera.up.clone(),target:controls.target.clone(),rotation:world.planet.quaternion.clone(),enabled:controls.enabled,min:controls.minDistance,max:controls.maxDistance,minPolar:controls.minPolarAngle,maxPolar:controls.maxPolarAngle,closeView:world.planet.userData.closeView,shadowVisible:shadow.visible,phase:document.documentElement.dataset.phase};
      previewing=true;previewElapsed=0;surfaceDrag.reset();focusedResident=null;followBuild=false;focusRotation=null;autoRotate=false;viewMode='globe';previewWeather='clear';previewHour=9.5;weatherType='clear';lighting=lightAt(previewHour);
      const w=WEATHER.clear;Object.assign(targetEnv,{rain:0,snow:0,cloud:w.cloud,wind:w.wind,night:0,mist:0,light:w.light,sunset:0,petAway:env.petAway,storm:0,tornado:0,rainbow:0,meteorShower:0,wetness:0});Object.assign(env,targetEnv);
      world.planet.quaternion.setFromUnitVectors(direction(.38,.06),new THREE.Vector3(0,1,0));world.planet.userData.closeView=true;controls.enabled=false;controls.target.set(0,0,0);controls.minDistance=5;controls.maxDistance=16;camera.up.set(0,1,0);camera.position.set(.45,3.28,6.7).normalize().multiplyScalar(12.1);controls.update();shadow.visible=false;
      document.documentElement.dataset.phase='morning';document.documentElement.dataset.view='globe';
    }else{
      const s=previewState;climate.restoreState(s.climate);previewing=false;gameStarted=true;surfaceDrag.reset();viewMode=s.viewMode;autoRotate=s.autoRotate;followBuild=s.followBuild;focusedResident=s.focusedResident;focusRotation=s.focusRotation;previewWeather=s.previewWeather;previewHour=s.previewHour;weatherType=s.weatherType;lighting=s.lighting;
      Object.assign(env,s.env);Object.assign(targetEnv,s.targetEnv);world.planet.quaternion.copy(s.rotation);world.planet.userData.closeView=s.closeView;camera.position.copy(s.position);camera.up.copy(s.up);controls.target.copy(s.target);controls.enabled=s.enabled;controls.minDistance=s.min;controls.maxDistance=s.max;controls.minPolarAngle=s.minPolar;controls.maxPolarAngle=s.maxPolar;controls.update();shadow.visible=s.shadowVisible;
      document.documentElement.dataset.phase=s.phase;document.documentElement.dataset.view=viewMode;setRotation();previewState=null;updateUi(new Date(),true);farmUI.render();save();lastInteraction=performance.now();
    }
    updateSky(0);fairySky.setActive(running&&!previewing);
    document.documentElement.dataset.preview=String(previewing);lastFrame=0;resize();
  }
  function frame(now){if(disposed)return;frameId=requestAnimationFrame(frame);if(!running){lastFrame=0;return;}const dt=lastFrame?Math.min((now-lastFrame)/1000,.05):0;lastFrame=now;if(previewing)previewElapsed+=dt;else elapsed+=dt;
    const visualTime=previewing?elapsed+previewElapsed:elapsed;
    if(!previewing)syncClimate(dt);
    $('app').style.setProperty('--weather-storm',String(Math.min(1,env.storm*.82+env.tornado*.65)));$('app').style.setProperty('--weather-cloud',String(env.cloud));
    if(!previewing&&now-lastUiAt>500){updateUi(new Date());lastUiAt=now;if(Date.now()>=state.nextAt)encounter();}
    for(const key of Object.keys(env))env[key]=THREE.MathUtils.damp(env[key],targetEnv[key],1.1,dt);
    if(viewMode==='globe'&&autoRotate&&!interacting&&now-lastInteraction>3500)world.planet.rotation.y+=dt*.025;
    const moon=env.night*(1-env.sunset*.92);sun.intensity=(1.72*(1-env.night)+.70*env.night+env.sunset*.36)*(.25+env.light*.75);hemi.intensity=.96*(1-moon)+.55*moon;fill.intensity=.30-moon*.06+env.sunset*.035;sun.color.copy(sunDay).lerp(sunNight,moon).lerp(sunsetColor,env.sunset*.94);sun.position.x=-3.5-env.sunset*2;sun.position.y=6-env.sunset*4.2;
    hemi.color.copy(hemiDay).lerp(hemiDusk,env.sunset*.8).lerp(hemiNight,moon);hemi.groundColor.copy(groundDay).lerp(groundDusk,env.sunset*.8).lerp(groundNight,moon);fill.color.copy(fillDay).lerp(fillDusk,env.sunset).lerp(fillNight,moon);
    surfaceDrag.update(dt);weatherEffects.update(dt,visualTime,{...env,preview:previewing},camera,Math.min(devicePixelRatio,1.25));nightSky.update(dt,visualTime,env,camera,Math.min(devicePixelRatio,1.25));
    // Keep the original depth-tested meteor; the painted sky owns the main star field.
    nightSky.stars.material.uniforms.uVisibility.value*=.24*(1-env.sunset);
    updateSky(dt);$('app').style.setProperty('--sunset-glow',String(env.sunset));
    shadowMat.opacity=.7*(1-env.night);renderer.toneMappingExposure=1.04+moon*.10;
    scene.fog.density=.024+env.mist*.044+env.rain*.008;scene.fog.color.copy(fogDay).lerp(fogDusk,env.sunset*.65).lerp(bgNight,moon);
    if(previewing){
      world.planet.rotation.y+=dt*.032;world.update(dt,visualTime,{...env,buildPaused:true});controls.update();renderer.render(scene,camera);
      if(!$('loading').hidden){$('loading').hidden=true;document.documentElement.dataset.ready='true';}return;
    }
    const wasComplete=state.construction.elapsed>=BUILD_DURATION;
    advanceConstruction(state.construction,dt,!buildPreview&&!restReason());
    const build=world.construction.setProgress(buildPreview?BUILD_DURATION:state.construction.elapsed);
    if(!buildPreview&&build.index!==lastBuildIndex){lastBuildIndex=build.index;if(followBuild&&viewMode==='meadow'&&!build.complete)focusBuilding();}
    if(focusRotation){world.planet.quaternion.slerp(focusRotation,1-Math.exp(-dt*3));if(world.planet.quaternion.angleTo(focusRotation)<.0001)focusRotation=null;}
    const farmJobs=farmUI.beforeFrame(dt,elapsed,env);world.update(dt,elapsed,{...env,farmJobs,buildPaused:state.construction.paused||buildPreview||!!restReason()});farmUI.afterFrame(dt);if(focusedResident&&!focusedResident.root.visible){const name=focusedResident.name;setView('meadow');toast(name+'已经回家睡觉了，明早再见。');}if(focusedResident){world.planet.updateMatrixWorld(true);const target=focusedResident.root.getWorldPosition(new THREE.Vector3()).addScaledVector(focusedResident.normal.clone().applyQuaternion(world.planet.quaternion),.25),delta=target.sub(controls.target).multiplyScalar(1-Math.exp(-dt*5));controls.target.add(delta);camera.position.add(delta);}controls.update();renderer.render(scene,camera);
    if(now-lastBuildSaved>5000){save();lastBuildSaved=now;}
    if(!wasComplete&&state.construction.elapsed>=BUILD_DURATION){save();toast('小岛建好啦！这是三位小伙伴一起造的家。');}

    if(!$('loading').hidden){$('loading').hidden=true;document.documentElement.dataset.ready='true';}
  }
  // Diagnostics are read-only and useful for local regression checks.
  window.littleBloom={getState:()=>({scenic,previewing,running,elapsed,drag:surfaceDrag.getState(),renderProfile:{exposure:renderer.toneMappingExposure,cloudShell:false,grassCount:world.meadow.blades.count},fishing:world.fishing.getState(),cameraAspect:camera.aspect,cameraFov:camera.fov,nightSky:nightSky.getState(),fairySky:fairySky.getState(),streetLights:world.pathLights.getState(),homes:world.homes.getState(),cottages:world.cottages.length,focusedAnimal:focusedResident?.name||null,farm:JSON.parse(JSON.stringify(state.farm)),viewMode,cameraDistance:camera.position.distanceTo(controls.target),style:'painted-animation',orientation:world.planet.quaternion.toArray(),cameraPosition:camera.position.toArray(),climate:climate.getState(),weatherEffects:weatherEffects.getState(),seasonal:world.seasonal?.getState?.()||null,environment:{...env},timeHour:climateState.hour,sunset:env.sunset,trees:world.stats.trees,grassBlades:world.meadow.count,shadowResolution:sun.shadow.mapSize.x,shadowEveryFrame:renderer.shadowMap.autoUpdate,construction:{...state.construction,preview:buildPreview,complete:world.construction.getState().complete,project:world.construction.getState().project.id,workers:world.residents.map(p=>({name:p.name,species:p.species,activity:p.activity}))},date:state.day,weather:weatherType,naturalWeather:weatherSlot.type,preview:climateState.mode==='journey'||climateState.seasonMode!=='auto'||climateState.weatherMode!=='auto'||previewWeather!==null||previewHour!==null,night:env.night,growth:state.growth,residents:world.residents.length,plants:world.stats.trees+world.stats.flowers+world.stats.shrubs+state.growth,nextEventAt:state.nextAt,history:state.history.map(e=>({...e})),travel:{...state.travel,away:travelIsAway()},drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,storageAvailable:saved})};
  window.littleBloom.getCottages=()=>world.cottages.map(c=>({name:c.name,...c.getState()}));
  setPreview(preview);frameId=requestAnimationFrame(frame);
  const onPageHide=()=>{save();};addEventListener('pagehide',onPageHide,{once:true});
  const dispose=()=>{if(disposed)return;disposed=true;running=false;cancelAnimationFrame(frameId);clearTimeout(toastTimer);document.removeEventListener?.('keydown',onDocumentKeydown);document.removeEventListener?.('visibilitychange',onVisibilityChange);removeEventListener('pagehide',onPageHide);resizeObserver.disconnect();stopSurfaceDrag();controls.dispose();world.dispose();shadow.geometry.dispose();shadowMat.dispose();shadowTexture.dispose();nightSky.dispose();weatherEffects.dispose();fairySky.dispose();renderer.dispose();renderer.domElement.remove();};
  dispose.setPreview=setPreview;return dispose;
}
try { return boot(); } catch(error) { console.error(error); fatal('星球暂时没有成功醒来。请使用支持 WebGL 的浏览器，并开启图形加速后重试。');return()=>{}; }
}
