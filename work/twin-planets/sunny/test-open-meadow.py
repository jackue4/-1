from pathlib import Path
p=Path('work/planet-v2/test.js');s=p.read_text(encoding='utf-8').replace('assert.ok(world.stats.trees>=35)','assert.ok(world.stats.trees>=12&&world.stats.trees<=20)').replace('assert.ok(l.counts.fencePosts>30)','assert.ok(l.counts.fencePosts>20)').replace('assert.ok(world.canopy.count>400)','assert.ok(world.canopy.count>=100&&world.canopy.count<=160)')
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/test-app.mjs');s=p.read_text(encoding='utf-8').replace("'10:30'","'08:30'")
s=s.replace("if(name==='canvas'){el.getContext", "if(name==='canvas'){el.setPointerCapture=()=>{};el.releasePointerCapture=()=>{};el.clientHeight=527;el.clientWidth=980;el.getContext")
needle="for(const type of ['clear','cloudy','rain','mist','snow'])"
a=s.index(needle)
s=s[:a]+'''const canvas=document.querySelector('#scene canvas');
function pointer(type,id,x,y,pointerType='mouse'){const e=new window.Event(type);Object.assign(e,{pointerId:id,clientX:x,clientY:y,pageX:x,pageY:y,pointerType,button:0});canvas.dispatchEvent(e);}
function orientation(){return [...window.littleBloom.getState().orientation];}
function dot(a,b){return Math.abs(a.reduce((v,n,i)=>v+n*b[i],0));}
const original=orientation(),cameraBefore=[...window.littleBloom.getState().cameraPosition];
pointer('pointerdown',1,200,240);
for(let i=1;i<=12;i++){pointer('pointermove',1,200+527*i/12,240);if(i===6)assert.ok(dot(original,orientation())<.01,'half turn reveals opposite hemisphere');}
pointer('pointerup',1,727,240);assert.ok(dot(original,orientation())>.99999,'horizontal full revolution returns to start');
pointer('pointerdown',2,200,240);
for(let i=1;i<=12;i++){pointer('pointermove',2,200,240+527*i/12);if(i===6)assert.ok(dot(original,orientation())<.01,'vertical drag passes the old polar limit');}
pointer('pointerup',2,200,767);assert.ok(dot(original,orientation())>.99999);assert.deepEqual([...window.littleBloom.getState().cameraPosition],cameraBefore);
pointer('pointerdown',3,200,240);pointer('pointercancel',3,200,240);pointer('pointermove',3,400,400);assert.ok(dot(original,orientation())>.99999);
pointer('pointerdown',4,200,240,'touch');pointer('pointerdown',5,280,240,'touch');const distanceBefore=window.littleBloom.getState().cameraDistance;
pointer('pointermove',5,360,240,'touch');assert.ok(dot(original,orientation())>.99999,'two fingers do not also rotate surface');assert.ok(window.littleBloom.getState().cameraDistance<distanceBefore,'pinch still zooms');
pointer('pointerup',5,360,240,'touch');pointer('pointerup',4,200,240,'touch');$('home-view').click();
checks.push('Mouse and touch roam through both hemispheres, cancel cleanly and preserve pinch zoom');
const backgrounds=new Set();
for(const [hour,phase] of [[8.5,'morning'],[17.5,'dusk'],[22,'night']]){
  document.querySelector(`[data-time="${hour}"]`).click();frames(120);assert.equal(document.documentElement.dataset.phase,phase);assert.equal(window.littleBloom.getState().timeHour,hour);assert.equal(document.querySelector(`[data-time="${hour}"]`).getAttribute('aria-pressed'),'true');backgrounds.add(document.body.style.backgroundColor);
  if(phase==='dusk')assert.ok(window.littleBloom.getState().sunset>.95);if(phase==='night')assert.ok(window.littleBloom.getState().night>.95);
}
assert.equal(backgrounds.size,3);$('natural-time').click();frames();assert.equal(window.littleBloom.getState().preview,false);assert.equal($('natural-time').getAttribute('aria-pressed'),'true');$('sunny-view').click();frames();
checks.push('Morning, dusk and night presets change light and sky; natural time restores live weather');
''' +s[a:]
p.write_text(s,encoding='utf-8')
