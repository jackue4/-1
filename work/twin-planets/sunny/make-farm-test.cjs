const fs=require('fs');let s=fs.readFileSync('work/planet-v2/test-app.mjs','utf8');s=s.slice(0,s.indexOf('const checks=[];'));
s+=`
const checks=[];
const snapshot=()=>window.littleBloom.getState().farm;
assert.equal(snapshot().unlocked,6);assert.equal(document.documentElement.dataset.panel,'farm');
$('farm-helpers').click(); // Manual actions must remain meaningful with helpers resting.
$('plot-0').click();$('seed-radish').click();$('farm-plant').click();assert.equal(snapshot().plots[0].crop,'radish');
const seeds=snapshot().seeds.radish;$('farm-plant').click();assert.equal(snapshot().seeds.radish,seeds);$('farm-water').click();assert.equal(snapshot().plots[0].water,100);
now+=60000;frames(20);assert.equal(snapshot().plots[0].growth,1);assert.equal($('farm-harvest').disabled,false);$('farm-harvest').click();assert.equal(snapshot().produce.radish,2);
$('plot-1').click();$('seed-wheat').click();$('farm-plant').click();$('farm-water').click();now+=101000;frames(20);assert.equal(snapshot().plots[1].growth,1);$('farm-harvest').click();
document.querySelector('[data-farm-tab="pantry"]').click();const snacks=window.littleBloom.getState().travel.snacks;$('cook-picnic').click();assert.equal(window.littleBloom.getState().travel.snacks,snacks+2);assert.equal(snapshot().produce.radish,0);assert.equal(snapshot().produce.wheat,1);checks.push('HTML planting, watering, timed growth, harvest and cooking consume real inventory');
document.querySelector('[data-pane="travel"]').click();assert.equal($('farm-panel').hidden,true);assert.equal(document.querySelector('.pet-card').hidden,false);$('travel-button').click();now+=110000;frames(20);assert.equal(snapshot().strawberry,true);assert.equal(snapshot().seeds.strawberry,2);const postcards=window.littleBloom.getState().travel.postcards.length;frames(20);assert.equal(snapshot().seeds.strawberry,2);assert.equal(window.littleBloom.getState().travel.postcards.length,postcards);checks.push('Trip returns a postcard and two special seeds exactly once');
$('farm-focus').click();document.querySelector('[data-farm-tab="garden"]').click();$('plot-0').click();$('seed-strawberry').click();$('farm-plant').click();assert.equal(snapshot().plots[0].crop,'strawberry');checks.push('Returned seeds can immediately be planted; farm focus restores the garden');
$('plot-2').click();$('seed-radish').click();$('farm-plant').click();$('farm-water').click();now+=60000;frames(20);$('farm-harvest').click();document.querySelector('[data-farm-tab="village"]').click();$('farm-order').click();assert.equal(snapshot().orders,1);$('farm-expand').click();assert.equal(snapshot().unlocked,12);$('plot-6').click();assert.ok($('plot-title').textContent.includes('7'));checks.push('Neighbor order funds a real six-plot expansion');
const persisted=JSON.parse(stored.get('little-bloom.ecosystem.v2'));assert.equal(persisted.farm.unlocked,12);assert.equal(persisted.farm.plots[0].crop,'strawberry');assert.equal(persisted.travel.postcards.length,postcards);checks.push('Farming, construction and travel share a preserved persistent save');
// Exercise actual raycasting against a projected soil bed, then reject a dragged click.
$('farm-focus').click();frames(2);
const {Vector3,Quaternion,PerspectiveCamera}=await import(realThree);
const state=window.littleBloom.getState(),cam=new PerspectiveCamera(38,980/527,.1,60);cam.position.fromArray(state.cameraPosition);cam.lookAt(0,2.67,0);cam.updateMatrixWorld();
const lat=.44,lon=.136,n=new Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));
const pos=n.clone().multiplyScalar(2.45+.14+.05).applyQuaternion(new Quaternion().fromArray(state.orientation)).project(cam),x=(pos.x+1)*490,y=(1-pos.y)*263.5;
const canvas=document.querySelector('#scene canvas');function pointer(type,x,y){const e=new window.Event(type);Object.assign(e,{pointerId:4,clientX:x,clientY:y,pageX:x,pageY:y,pointerType:'mouse',button:0});canvas.dispatchEvent(e);}
pointer('pointerdown',x,y);pointer('pointerup',x,y);assert.ok($('plot-title').textContent.startsWith('第 6 块田'),'3D bed click selects plot 6');const title=$('plot-title').textContent;pointer('pointerdown',x,y);pointer('pointermove',x+30,y+30);pointer('pointerup',x+30,y+30);assert.equal($('plot-title').textContent,title);checks.push('Actual Three raycast selects a visible plot while dragging does not trigger planting');
assert.deepEqual(fatalErrors,[]);console.log(JSON.stringify({passed:checks.length,checks,note:'Real DOM and Three scene; renderer stubbed, not browser GPU validation.'},null,2));
`;
fs.writeFileSync('work/planet-v2/test-farm-app.mjs',s);
