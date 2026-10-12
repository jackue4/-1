from pathlib import Path
p=Path('work/planet-v2/page.html');s=p.read_text(encoding='utf-8')
s=s.replace('    <div class="planet-caption">', '''    <aside class="build-card" aria-label="小动物建岛计划">
      <div class="card-overline">一起把小岛建起来 <span id="build-count">1 / 8</span></div>
      <h2 id="build-title">铺一条通往家的小路</h2>
      <p id="build-phase">小伙伴正在准备木料</p>
      <div id="build-progress" class="build-progress" role="progressbar" aria-label="小岛建造进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="build-fill"></i></div>
      <div class="build-meta"><span id="build-percent">0%</span><span id="build-remaining">约 6 分钟</span></div>
      <p class="build-crew" id="build-crew">🐰 棉棉与伙伴们，一起开工啦</p>
      <div class="build-actions"><button id="build-pause" aria-pressed="false">Ⅱ 暂停</button><button id="build-speed" aria-pressed="false">3× 加速</button><button id="build-focus" aria-pressed="true" title="跟随下一处工地，手动拖动会退出跟随">⌖ 看工地</button></div>
      <div class="build-links"><button id="build-preview">看完整小岛</button><button id="build-replay">↻ 重新观看</button></div>
      <small>建造进度自动保存 · 旅行记录独立保留</small>
    </aside>
    <div class="planet-caption">''')
s=s.replace('位小居民','位动物邻居').replace('点击小居民，可以认识他们。','点击小动物，可以认识它和它正在忙的事情。')
s=s.replace('<p>停留时，每隔约', '<p>小动物会用约 6 分钟完成 8 项建岛工作，依次铺路、建木屋、风车和码头。可以暂停或加速，也可以预览成品、重新观看；预览不会改变实际进度。雨雪和深夜会歇工，页面隐藏后暂停建造。</p><p>停留时，每隔约')
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/style.css')
with p.open('a',encoding='utf-8') as f:f.write('''
.build-card{position:absolute;z-index:3;right:3%;bottom:124px;width:238px;padding:17px;border-radius:18px;background:var(--panel);border:1px solid #ffffff94;box-shadow:0 8px 28px #415d4414;backdrop-filter:blur(12px)}.build-card h2{font-size:14px;font-weight:500;line-height:1.5;margin:13px 0 5px}.build-card p{font-size:10px;line-height:1.7;color:var(--muted);margin:0 0 10px}.build-progress{height:6px;border-radius:5px;background:#75946a24;overflow:hidden}.build-progress i{display:block;height:100%;width:0;background:#91b479;border-radius:5px;transition:width .5s linear}.build-meta{display:flex;justify-content:space-between;margin:6px 0 11px;font-size:9px;color:var(--muted)}.build-crew{min-height:28px}.build-actions{display:flex;gap:5px}.build-actions button{flex:1;font-size:9px;white-space:nowrap;padding:8px 3px;border:1px solid var(--line);border-radius:8px}.build-actions button[aria-pressed=true]{background:#85a87830}.build-links{display:flex;justify-content:space-between;margin:13px 0}.build-links button{font-size:10px;color:var(--muted);padding:0}.build-card small{font-size:8px;color:var(--muted)}
@media(max-height:760px) and (min-width:801px){.build-card{bottom:118px;padding:12px 14px}.build-card h2{margin-top:8px}.build-crew{display:none}.build-card small{display:none}.build-links{margin-bottom:0}}
@media(max-width:800px){.build-card{right:3%;bottom:143px;width:160px;padding:11px;border-radius:14px}.build-card h2{font-size:11px;margin:7px 0 4px}.build-card p{font-size:8px;margin-bottom:7px}.build-card .card-overline{font-size:8px;letter-spacing:0}.build-card .build-crew,.build-card small{display:none}.build-meta{font-size:8px;margin-bottom:7px}.build-actions{gap:3px}.build-actions button{font-size:8px;padding:7px 1px}.build-links{margin:9px 0 0}.build-links button{font-size:8px}}
''')
p=Path('work/planet-v2/app.js');s=p.read_text(encoding='utf-8')
s=s.replace("  let saved = persist", "  let buildPreview=false,followBuild=true,buildUiSignature='',lastBuildSaved=0,lastBuildIndex=-1,focusRotation=null;\n  let saved = persist")
a=s.index('  function save(){')
s=s[:a]+'''  function restReason(){return weatherType==='rain'?'下雨了，伙伴们先歇一歇':weatherType==='snow'?'雪天休息，放晴再继续':lighting.daylight<.18?'夜深了，伙伴们明早继续':'';}
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
    $('build-crew').textContent=world.residents.slice(0,2).map(p=>`${p.species}${p.name} · ${p.activity}`).join('，');
    $('build-pause').textContent=state.construction.paused?'▶ 继续':'Ⅱ 暂停';$('build-pause').disabled=buildPreview||b.complete;$('build-pause').setAttribute('aria-pressed',String(state.construction.paused));
    $('build-speed').textContent=state.construction.speed===3?'1× 慢慢来':'3× 加速';$('build-speed').setAttribute('aria-pressed',String(state.construction.speed===3));
    $('build-focus').setAttribute('aria-pressed',String(followBuild));$('build-preview').textContent=buildPreview?'返回建造过程':'看完整小岛';
  }
  $('build-pause').onclick=()=>{state.construction.paused=!state.construction.paused;renderBuild();save();};
  $('build-speed').onclick=()=>{state.construction.speed=state.construction.speed===3?1:3;renderBuild();save();};
  $('build-focus').onclick=()=>{focusBuilding();renderBuild();};
  $('build-preview').onclick=()=>{buildPreview=!buildPreview;focusRotation=null;world.construction.setProgress(buildPreview?BUILD_DURATION:state.construction.elapsed);renderBuild();};
  $('build-replay').onclick=()=>{state.construction.elapsed=0;state.construction.paused=false;buildPreview=false;lastBuildIndex=-1;world.construction.setProgress(0);focusBuilding();renderBuild();save();toast('从一片绿草地开始，再看小伙伴建一次家。');};
''' +s[a:]
s=s.replace('    finishTrip(now.getTime());renderTravel(now.getTime());','    finishTrip(now.getTime());renderTravel(now.getTime());')
s=s.replace('    targetEnv.petAway=travelIsAway(now.getTime())?1:0;', '    targetEnv.petAway=travelIsAway(now.getTime())?1:0;renderBuild();')
s=s.replace("toast(`${resident.name}：", "toast(`${resident.species}${resident.name}（${resident.job}）· ${resident.activity}：")
s=s.replace("controls.addEventListener('start',()=>{interacting=true;", "controls.addEventListener('start',()=>{followBuild=false;focusRotation=null;buildUiSignature='';interacting=true;")
s=s.replace("active=>{interacting=active;lastInteraction=performance.now();}","active=>{interacting=active;lastInteraction=performance.now();if(active){followBuild=false;focusRotation=null;buildUiSignature='';}}")
s=s.replace("    const offset=camera.position.clone().sub(controls.target)", "    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key)){followBuild=false;focusRotation=null;buildUiSignature='';}\n    const offset=camera.position.clone().sub(controls.target)")
s=s.replace("    viewMode=mode;const close=", "    focusRotation=null;viewMode=mode;const close=")
s=s.replace("    world.update(dt,elapsed,env);controls.update();renderer.render(scene,camera);", '''    const wasComplete=state.construction.elapsed>=BUILD_DURATION;
    advanceConstruction(state.construction,dt,!buildPreview&&!restReason());
    const build=world.construction.setProgress(buildPreview?BUILD_DURATION:state.construction.elapsed);
    if(!buildPreview&&build.index!==lastBuildIndex){lastBuildIndex=build.index;if(followBuild&&viewMode==='meadow'&&!build.complete)focusBuilding();}
    if(focusRotation){world.planet.quaternion.slerp(focusRotation,1-Math.exp(-dt*3));if(world.planet.quaternion.angleTo(focusRotation)<.0001)focusRotation=null;}
    world.update(dt,elapsed,{...env,buildPaused:state.construction.paused||buildPreview||!!restReason()});controls.update();renderer.render(scene,camera);
    if(now-lastBuildSaved>5000){save();lastBuildSaved=now;}
    if(!wasComplete&&state.construction.elapsed>=BUILD_DURATION){save();toast('小岛建好啦！这是六位小伙伴一起造的家。');}
''')
s=s.replace("date:state.day,weather:", "shadowEveryFrame:renderer.shadowMap.autoUpdate,construction:{...state.construction,preview:buildPreview,complete:world.construction.getState().complete,project:world.construction.getState().project.id,workers:world.residents.map(p=>({name:p.name,species:p.species,activity:p.activity}))},date:state.day,weather:")
p.write_text(s,encoding='utf-8')
