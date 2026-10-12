const fs=require('fs'),path=require('path');
const dir=__dirname;
function edit(name,fn){const p=path.join(dir,name);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
function replace(s,a,b){if(!s.includes(a))throw Error('Missing: '+a.slice(0,100));return s.replace(a,b);}
edit('world.js',s=>{
 s="import {createFishingBay} from './fishing.js';\n"+s;
 s=replace(s,'  const homes=createResidentHomes',`  const fishing=createFishingBay({planet,lake:lakes[1],shoreNormal,navigation,height:terrainHeight,R,mesh,cyl,box,sphere,stem});
  residents[2].normal.copy(fishing.normal);moveOnSurface(residents[2].root,residents[2].normal);
  const homes=createResidentHomes`);
 s=replace(s,'const dynamic=new Set([','const dynamic=new Set([fishing.root,fishing.bobber,');
 s=replace(s,'builder=helper||home?null:',"fishingPose=sheltered?null:fishing.pose(p.i,env),builder=helper||home||fishingPose?null:");
 s=replace(s,'leisure=home||islandLife.pose','leisure=home||fishingPose||islandLife.pose');
 s=replace(s,'const encounter=[',"const encounter=!fishingPose&&[");
 s=replace(s,'const settled=!helper&&!builder&&!encounter&&distance<.045;',"const settled=!helper&&!builder&&!encounter&&distance<(fishingPose?.006:.045);");
 s=replace(s,"if(home)p.activity=", "if(p.i===2){fishing.update(t,p,!!fishingPose&&settled);if(fishingPose)p.activity=settled?'坐在小凳子上，等鱼儿咬钩':'沿着岸边去钓鱼';}\n      if(home)p.activity=");
 s=replace(s,"p.activity='在'+p.homeName+'睡觉';return;", "p.activity='在'+p.homeName+'睡觉';if(p.i===2)fishing.update(t,p,false);return;");
 s=replace(s,'return {planet,farm,','return {planet,fishing,farm,');
 return s;
});
edit('farm-ui.js',s=>{
 s=replace(s,'focus,renderTravel})','focus,renderTravel,scenic=false})');
 s=replace(s,'function showPane(name){','function showPane(name){if(scenic)name="none";');
 s=replace(s,'selected=i;world.farm.select(i);','selected=i;if(!scenic)world.farm.select(i);');
 return s;
});
edit('app.js',s=>{
 s=replace(s,"function boot() {","function boot() {\n  const scenic=document.documentElement.dataset.experience==='scenic';\n  if(scenic)document.querySelectorAll('.island-nav,#farm-panel,.pet-card,.build-card,.weather-card,#farm-focus,.intro,.footer').forEach(el=>{el.hidden=true;el.inert=true;});");
 s=replace(s,"function resize(){const rect", "function resize(){const rect");
 s=replace(s,"camera.fov=viewMode==='meadow'?(rect.width<500?49:38):(rect.width<500?44:38);", "camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(viewMode==='meadow'?38:38)/2)/Math.min(1,Math.max(.42,camera.aspect))));");
 s=replace(s,"$('coast-view').setAttribute('aria-pressed','false');", "$('coast-view').setAttribute('aria-pressed','false');$('fishing-view').setAttribute('aria-pressed','false');");
 const marker="  let animalIndex=0;";
 s=replace(s,marker,`  $('fishing-view').onclick=()=>{
    setView('meadow');followBuild=false;buildUiSignature='';
    const n=world.fishing.normal;world.planet.quaternion.setFromUnitVectors(n,new THREE.Vector3(0,1,0));world.planet.updateMatrixWorld(true);
    const q=world.planet.quaternion.clone().multiply(world.fishing.root.quaternion),front=new THREE.Vector3(0,0,1).applyQuaternion(q),side=new THREE.Vector3(1,0,0).applyQuaternion(q);
    controls.target.set(0,world.terrainHeight(n)+.12,0).addScaledVector(front,.20);
    camera.position.copy(controls.target).addScaledVector(front,1.15).addScaledVector(side,1.42).add(new THREE.Vector3(0,1.30,0));controls.minDistance=1.1;controls.update();
    $('fishing-view').setAttribute('aria-pressed','true');$('meadow-view').setAttribute('aria-pressed','false');
    toast(env.night>.58?'月亮出来了，阿栗收好鱼竿回家啦。':'风轻轻，浮漂晃一晃。阿栗在这里等鱼儿咬钩。');
  };
${marker}`);
 s=replace(s,'farmUI.select(o.userData.plotId);return;',"if(!scenic)farmUI.select(o.userData.plotId);return;");
 s=replace(s,'farmUI.activate(o.userData.farmPlace);return;',"if(!scenic)farmUI.activate(o.userData.farmPlace);return;");
 s=replace(s,'createFarmUI({getState:','createFarmUI({scenic,getState:');
 s=replace(s,'getState:()=>({nightSky:',"getState:()=>({scenic,fishing:world.fishing.getState(),cameraAspect:camera.aspect,cameraFov:camera.fov,nightSky:");
 return s;
});
edit('page.html',s=>{
 s=replace(s,'<html lang="zh-CN">','<html lang="zh-CN" data-experience="scenic">');
 s=replace(s,'width=device-width,initial-scale=1','width=device-width,initial-scale=1,viewport-fit=cover');
 s=replace(s,'❧ 晴日菜园','❧ 草原');s=replace(s,'≈ 珊瑚海湾','≈ 帆船');s=replace(s,'🐾 动物伙伴','🐾 伙伴');s=replace(s,'◉ 星球全景','◉ 全景');
 s=replace(s,'<button id="animal-view"','<button id="fishing-view" aria-pressed="false">♧ 垂钓</button><button id="animal-view"');
 s=replace(s,'拖动探索星球每一面 <b>·</b> 滚轮拉近一点','拖动探索 <b>·</b> 双指缩放');
 const a=s.indexOf('<dialog id="help-dialog">'),b=s.indexOf('</dialog>',a);
 s=s.slice(0,a)+`<dialog id="help-dialog"><form method="dialog"><button class="icon-button close-help" aria-label="关闭说明">×</button></form><div class="eyebrow">A QUIET LITTLE WORLD</div><h2>让生活，慢半拍。</h2><p>一根手指拖动，探索星球每一面；双指张合拉近或拉远。电脑也支持鼠标拖动和滚轮缩放。</p><p>底部选择草原、帆船、垂钓、伙伴或全景。阿栗白天在另一片海湾坐着钓鱼，雨雪或夜晚会离开；小动物入夜后回家休息。</p><p>顶部切换早晨、黄昏、夜晚，或选择自然时间。自然天气依设备日期变化；首次打开是晴日上午。晴朗夜空偶尔有流星划过。</p><p>现在是清爽的观景模式，菜园、旅行和建造面板暂时收起，原有进度仍保存在当前浏览器。公网地址与本地页面的存档分别保存。</p><button id="quality-toggle" type="button" class="return-button" aria-pressed="false">流畅模式：关闭</button></dialog>`+s.slice(b+9);
 return s;
});
edit('style.css',s=>s+`
/* Scenic edition: full-width canvas, thumb-friendly controls and iOS safe areas. */
html[data-experience=scenic],html[data-experience=scenic] body{height:100%;overscroll-behavior:none}
html[data-experience=scenic] #app{height:100vh;height:100dvh;min-height:0;overflow:hidden}
html[data-experience=scenic] :is(.island-nav,#farm-panel,.pet-card,.build-card,.weather-card,#farm-focus,.intro,.footer){display:none!important}
html[data-experience=scenic] #scene{inset:0;left:0;top:0;width:100%;height:100%;touch-action:none}
html[data-experience=scenic] .header{height:66px;top:env(safe-area-inset-top,0px);left:0;right:0;margin:0;padding:0 max(22px,env(safe-area-inset-left)) 0 max(22px,env(safe-area-inset-right));border:0;gap:14px;pointer-events:none}
html[data-experience=scenic] .header :is(a,button){pointer-events:auto}
html[data-experience=scenic] .brand{font-size:24px;gap:8px}
html[data-experience=scenic] .brand-mark{font-size:30px}
html[data-experience=scenic] .brand-sub{font-size:9px;letter-spacing:1.8px}
html[data-experience=scenic] .icon-button{width:44px;height:44px;flex-shrink:0;background:#fffcedd9}
html[data-experience=scenic] .view-switch{position:absolute;top:auto;bottom:calc(20px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100% - 24px - env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px));display:flex;gap:4px;padding:6px;border:1px solid #fff8daab;background:#ffffefe6;border-radius:24px;box-shadow:0 8px 32px #294a3520;backdrop-filter:blur(12px);z-index:5}
html[data-experience=scenic] .view-switch button{font-size:12px;min-width:62px;min-height:46px;padding:8px 16px;white-space:nowrap;border-radius:18px;letter-spacing:.3px;color:#566958;touch-action:manipulation}
html[data-experience=scenic] .view-switch button[aria-pressed=true]{background:#dce9ca;color:#365842;box-shadow:inset 0 0 0 1px #78977430}
html[data-experience=scenic] .time-presets{top:calc(76px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);display:flex;width:max-content;max-width:calc(100% - 24px);gap:2px;border-radius:24px;padding:3px 5px;background:#fffdefce;z-index:4}
html[data-experience=scenic] .time-presets button{min-width:62px;min-height:44px;padding:7px 11px;font-size:11px;border-radius:20px;touch-action:manipulation}
html[data-experience=scenic] .planet-caption{left:50%;bottom:calc(92px + env(safe-area-inset-bottom,0px));width:auto;top:auto;font-size:10px;padding:6px 11px;border-radius:16px;background:#fffcec8c;color:#58705d;letter-spacing:1px}
html[data-experience=scenic] .toast{top:auto;bottom:calc(134px + env(safe-area-inset-bottom,0px));width:max-content;max-width:calc(100% - 36px);white-space:normal;font-size:12px;line-height:1.7;text-align:center;pointer-events:none;z-index:8}
html[data-experience=scenic] dialog{width:min(420px,calc(100% - 32px));max-height:calc(100dvh - 80px - env(safe-area-inset-top,0px));overflow-y:auto;padding:28px 24px;border-radius:24px}
html[data-experience=scenic] dialog p{font-size:13px;line-height:1.85}
html[data-experience=scenic] .close-help{top:12px;right:12px}
@media(max-width:600px){
 html[data-experience=scenic] .header{padding:0 16px;height:64px}
 html[data-experience=scenic] .brand{font-size:22px}
 html[data-experience=scenic] .live{display:none}
 html[data-experience=scenic] #help-button{margin-left:auto}
 html[data-experience=scenic] .view-switch{width:calc(100% - 28px);gap:2px;justify-content:space-between;padding:5px;border-radius:23px}
 html[data-experience=scenic] .view-switch button{flex:1;min-width:0;padding:8px 3px;font-size:12px;min-height:48px}
 html[data-experience=scenic] .time-presets{top:calc(74px + env(safe-area-inset-top,0px))}
 html[data-experience=scenic] .paper{opacity:.06}
}
@media(max-height:540px) and (orientation:landscape){
 html[data-experience=scenic] .header{height:52px;padding-left:calc(16px + env(safe-area-inset-left));padding-right:calc(16px + env(safe-area-inset-right))}
 html[data-experience=scenic] .brand-sub,html[data-experience=scenic] .live,html[data-experience=scenic] .planet-caption{display:none}
 html[data-experience=scenic] .time-presets{top:calc(6px + env(safe-area-inset-top));max-width:50%}
 html[data-experience=scenic] .view-switch{bottom:calc(8px + env(safe-area-inset-bottom));padding:3px}
 html[data-experience=scenic] .view-switch button{min-height:44px}
}
`);
console.log('Integrated fishing and scenic mobile UI');
