from pathlib import Path
p=Path('work/planet-v2/app.js');s=p.read_text(encoding='utf-8')
s=s.replace("import { createWorld }", "import { createWorld, direction }")
s=s.replace('previewWeather = null, previewHour = null','previewWeather = \'clear\', previewHour = 10.5')
s=s.replace("autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches", "autoRotate = false, viewMode = 'meadow'")
s=s.replace("new THREE.HemisphereLight('#f7fcff','#abc7c4',1.85)","new THREE.HemisphereLight('#d5edff','#648059',.9)")
s=s.replace('sun.shadow.mapSize.set(2048,2048)','sun.shadow.mapSize.set(3072,3072)').replace('sun.shadow.normalBias=.025','sun.shadow.normalBias=.008')
s=s.replace("camera.fov=rect.width<500?44:38","camera.fov=viewMode==='meadow'?(rect.width<500?49:38):(rect.width<500?44:38)")
s=s.replace("  $('rotate-toggle').onclick=()=>{autoRotate=!autoRotate;setRotation();};setRotation();", "  $('rotate-toggle').onclick=()=>{if(viewMode==='meadow'){setView('globe');autoRotate=true;}else autoRotate=!autoRotate;setRotation();};setRotation();")
a=s.index("  $('home-view').onclick=");b=s.index('\n',a)
s=s[:a]+'''  function setView(mode){
    viewMode=mode;const close=mode==='meadow';document.documentElement.dataset.view=mode;
    world.planet.userData.closeView=close;world.planet.rotation.set(0,0,0);
    if(close){
      world.planet.quaternion.setFromUnitVectors(direction(.30,.23),new THREE.Vector3(0,1,0));
      controls.target.set(0,2.67,0);camera.position.set(1.85,5.45,3.25);
      controls.minDistance=2.1;controls.maxDistance=6.8;controls.minPolarAngle=.12;controls.maxPolarAngle=1.12;
      autoRotate=false;setRotation();
    }else{
      world.planet.rotation.set(0,0,-.09);controls.target.set(0,.12,0);camera.position.copy(homePosition);
      controls.minDistance=5.3;controls.maxDistance=14;controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI;
    }
    $('meadow-view').setAttribute('aria-pressed',String(close));$('globe-view').setAttribute('aria-pressed',String(!close));
    controls.update();resize();lastInteraction=performance.now();
  }
  $('meadow-view').onclick=()=>{setView('meadow');toast('林间漫游 · 拖动环顾，滚轮靠近。');};
  $('globe-view').onclick=()=>setView('globe');
  $('home-view').onclick=()=>{setView(viewMode);toast('回到这条熟悉的小路。');};''' +s[b:]
s=s.replace("$('sunny-view').onclick=()=>{previewWeather='clear';previewHour=10.5;", "$('sunny-view').onclick=()=>{setView('meadow');previewWeather='clear';previewHour=10.5;")
s=s.replace("toast('晴日海岸 · 把这一刻留给阳光和海风。');","toast('晴日林间 · 阳光落在草尖上。');")
s=s.replace("  updateUi(new Date(),true);Object.assign(env,targetEnv);diary();save();","  setView('meadow');updateUi(new Date(),true);Object.assign(env,targetEnv);diary();save();")
s=s.replace('if(autoRotate&&!interacting','if(viewMode===\'globe\'&&autoRotate&&!interacting')
s=s.replace('hemi.intensity=1.85*(1-env.night)+.95*env.night;fill.intensity=.68+env.night*.25','hemi.intensity=.9*(1-env.night)+.65*env.night;fill.intensity=.25+env.night*.2')
s=s.replace('renderer.toneMappingExposure=1.13+env.night*.15','renderer.toneMappingExposure=1.02+env.night*.19')
s=s.replace("({date:state.day,weather:","({viewMode,cameraDistance:camera.position.distanceTo(controls.target),date:state.day,weather:")
# Keyboard orbit in close mode stays above the landscape, zoom is relative to the target.
a=s.index("  renderer.domElement.addEventListener('keydown',");b=s.index('\n',a)
s=s[:a]+'''  renderer.domElement.addEventListener('keydown',e=>{
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','Home',' '].includes(e.key))e.preventDefault();
    const offset=camera.position.clone().sub(controls.target),orbit=new THREE.Spherical().setFromVector3(offset);
    if(e.key==='ArrowLeft')orbit.theta-=.12;if(e.key==='ArrowRight')orbit.theta+=.12;
    if(e.key==='ArrowUp')orbit.phi-=.12;if(e.key==='ArrowDown')orbit.phi+=.12;
    if(e.key==='+'||e.key==='=')orbit.radius*=.92;if(e.key==='-')orbit.radius*=1.08;
    orbit.phi=THREE.MathUtils.clamp(orbit.phi,Math.max(.01,controls.minPolarAngle),Math.min(Math.PI-.01,controls.maxPolarAngle));
    orbit.radius=THREE.MathUtils.clamp(orbit.radius,controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(orbit));controls.update();
    if(e.key==='Home')$('home-view').click();if(e.key===' ')$('rotate-toggle').click();lastInteraction=performance.now();
  });''' + s[b:]
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/page.html');s=p.read_text(encoding='utf-8')
s=s.replace('晴日海岸 <span>','晴日林间 <span>').replace('预览上午十点半的晴日海岸','预览上午十点半的晴日林间')
s=s.replace('    <div id="scene"', '''    <nav class="view-switch" aria-label="观景视角"><button id="meadow-view" aria-pressed="true">❧ 林间漫游</button><button id="globe-view" aria-pressed="false">◉ 星球全景</button><span>WOODLAND DAYS / 01</span></nav>
    <div id="scene"''')
s=s.replace('拖动去另一面看看','拖动环顾这片绿意')
s=s.replace('光影跟随本地时间。','光影跟随本地时间。首次打开为晴日上午的观景预览，可随时恢复自然时间。')
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/style.css')
with p.open('a',encoding='utf-8') as f:f.write('''
/* Woodland view gives the landscape the canvas, while keeping play controls handy. */
.view-switch{position:absolute;top:112px;left:50%;transform:translateX(-50%);z-index:4;display:flex;align-items:center;padding:5px;border:1px solid #fff9;border-radius:28px;background:#ffffefe6;box-shadow:0 6px 28px #234c3220;gap:4px;white-space:nowrap}.view-switch button{padding:10px 18px;border-radius:22px;font-size:11px}.view-switch button[aria-pressed=true]{background:#477658;color:#fff9e9}.view-switch>span{display:none}
html[data-view=meadow] #scene{inset:0}
html[data-view=meadow] .header{height:80px;border:0;text-shadow:0 1px 5px #fff}
html[data-view=meadow] .intro{top:112px;left:3%;padding:0;pointer-events:none}
html[data-view=meadow] .intro h1,html[data-view=meadow] .intro p,html[data-view=meadow] .intro .eyebrow,html[data-view=meadow] .intro .visit{display:none}
html[data-view=meadow] .sunny-button{margin:0;background:#fff9d9ee;pointer-events:auto}
html[data-view=meadow] .view-switch{top:104px}
html[data-view=meadow] .weather-card{right:3%;top:104px;width:178px;padding:14px;background:#fffdf0e3}
html[data-view=meadow] .weather-main{margin:12px 0}.weather-card #preview-panel{max-height:45vh;overflow:auto}
html[data-view=meadow] .weather-main strong{font-size:30px}
html[data-view=meadow] .weather-card p,html[data-view=meadow] .weather-line,html[data-view=meadow] .forecast{display:none}
html[data-view=meadow] .pet-card{left:3%;top:auto;bottom:122px;background:#fffdf0e3;width:190px}
html[data-view=meadow] .footer{left:3%;right:3%;bottom:20px;align-items:center}
html[data-view=meadow] .event-card{padding:14px 16px;border-radius:18px;background:#fffdf0dc;width:290px;backdrop-filter:blur(12px)}
html[data-view=meadow] .event-top{margin-bottom:8px}
html[data-view=meadow] .event-body{min-height:40px}
html[data-view=meadow] .ecosystem{display:none}
html[data-view=meadow] .tools{margin:0 auto}
html[data-view=meadow] .planet-caption{bottom:87px;background:#fffbe0ce;padding:8px 16px;border-radius:24px;font-size:10px;color:#4b674f}
html[data-view=meadow] .paper{opacity:.03}
html[data-view=meadow]{--ink:#32513e;--muted:#67806d;--accent:#789352;--line:#56755226}
html[data-view=meadow] .postcard-panel{max-height:26vh;overflow:auto}
@media(max-width:800px){.view-switch{top:85px}.view-switch button{padding:8px 12px;font-size:10px}html[data-view=meadow] .view-switch{top:85px}html[data-view=meadow] .intro{top:136px}html[data-view=meadow] .weather-card{top:132px;width:140px;padding:10px}html[data-view=meadow] .pet-card{width:148px;bottom:143px;padding:10px}html[data-view=meadow] .footer{bottom:12px;gap:9px}html[data-view=meadow] .event-card{width:100%;padding:9px 12px}html[data-view=meadow] .planet-caption{display:none}html[data-view=meadow] .tools{align-self:center}}
''')
